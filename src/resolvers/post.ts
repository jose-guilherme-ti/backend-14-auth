import { GraphQLError } from "graphql";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { signUser } from "../auth";

const POST_CREATED = "POST_CREATED";
const POST_PUBLISH = "POST_POST_PUBLISH";

export default {
  Query: {
    posts: async (_, args, ctx) => {
      const where =
        args.published !== undefined ? { published: args.published } : {};
      return ctx.prisma.post.findMany({
        where,
        include: { author: true },
      });
    },

    post: async (_, args, ctx) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: args.id },
        include: { author: true },
      });
      if (!post) throw new GraphQLError("Post not found");
      return post;
    },

    users: async (_, __, ctx) => ctx.prisma.user.findMany(),

    user: async (_, args, ctx) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: args.id },
      });
      if (!user) throw new GraphQLError("User not found");
      return user;
    },
  },

  Mutation: {
    createPost: async (_, args, ctx) => {
      if (!ctx.user) throw new GraphQLError("Not authenticated");

      const post = await ctx.prisma.post.create({
        data: {
          title: args.title,
          content: args.content,
          authorId: ctx.user.id,
        },
        include: { author: true },
      });

      // ✔️ Publicando event corretamente
      ctx.pubsub.publish(POST_CREATED, { postCreated: post });

      // ✔️ Publicando event corretamente
      const where =
        args.published !== undefined ? { published: args.published } : {};
      const posts = ctx.prisma.post.findMany({
        where,
        include: { author: true },
      });
      ctx.pubsub.publish(POST_PUBLISH, { postPublish: posts });

      return post;
    },

    publishPost: async (_, args, ctx) => {
      if (!ctx.user) throw new GraphQLError("Not authenticated");

      const post = await ctx.prisma.post.findUnique({
        where: { id: args.id },
      });
      if (!post) throw new GraphQLError("Post not found");

      if (post.authorId !== ctx.user.id && ctx.user.role !== Role.ADMIN) {
        throw new GraphQLError("Forbidden");
      }

      const postUpdate = await ctx.prisma.post.update({
        where: { id: args.id },
        data: { published: args.published },
      });

      const where =
        args.published !== undefined ? { published: args.published } : {};

      const posts = await ctx.prisma.post.findMany({
        where,
        include: { author: true },
      });

      ctx.pubsub.publish(POST_PUBLISH, { postPublish: postUpdate });

      return postUpdate
    },

    signup: async (_, args, ctx) => {
      const hashed = await bcrypt.hash(args.password, 10);

      const user = await ctx.prisma.user.create({
        data: {
          email: args.email,
          name: args.name,
          password: hashed,
        },
      });

      const token = signUser(user);
      return { token, user };
    },

    login: async (_, args, ctx) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: args.email },
      });

      if (!user) throw new GraphQLError("Invalid credentials");

      const valid = await bcrypt.compare(args.password, user.password);
      if (!valid) throw new GraphQLError("Invalid credentials");

      const token = signUser(user);
      return { token, user };
    },
  },

  Subscription: {
    postCreated: {
      subscribe: (_, __, { pubsub }) => pubsub.subscribe(POST_CREATED),
      resolve: (payload) => payload.postCreated,
    },
    postPublish: {
      subscribe: (_, __, { pubsub }) => pubsub.subscribe(POST_PUBLISH),
      resolve: (payload) => payload.postPublish,
    },
  },

  Post: {
    author: (parent, _, ctx) =>
      ctx.prisma.user.findUnique({ where: { id: parent.authorId } }),
  },
};
