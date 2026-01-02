import { gql } from "apollo-server";

const typeDefs = gql`
  enum Role {
    USER
    ADMIN
  }

  type User {
    id: Int!
    email: String!
    name: String
    role: Role!
    createdAt: String!
    posts: [Post!]!
  }

  type Post {
    id: Int!
    title: String!
    content: String!
    published: Boolean!
    author: User!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # ============================
  # RESERVAS
  # ============================

  type Reservation {
    id: ID!
    date: String!
    clientName: String!
    eventName: String!
    durationHours: Int!
    paid: Boolean!
  }


  type CalendarReservation {
    date: String!
    paid: Boolean!
  }

  input CreateReservationInput {
    date: String!
    clientName: String!
    eventName: String!
    durationHours: Int!
  }

  # ============================
  # QUERIES
  # ============================

  type Query {
    me: User
    users: [User!]!
    user(id: Int!): User

    posts(published: Boolean): [Post!]!
    post(id: Int!): Post

    # 🔹 Admin / Cliente (calendário)
    reservations: [Reservation!]!

    # 🔹 Opcional (apenas datas pagas)
    blockedDates: [String!]!
    calendarReservations: [CalendarReservation!]!
  }

  # ============================
  # MUTATIONS
  # ============================

  type Mutation {
    signup(email: String!, password: String!, name: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    createPost(title: String!, content: String!): Post!
    publishPost(id: Int!, published: Boolean!): Post

    createReservation(input: CreateReservationInput!): Reservation!
    confirmPayment(reservationId: ID!): Reservation!
    removePayment(reservationId: ID!): Reservation!
  }

  # ============================
  # SUBSCRIPTIONS
  # ============================

  type Subscription {
    postCreated: Post!
    postPublish: Post!

    reservationCreated: Reservation!
    paymentConfirmed: Reservation!
    paymentRemoved: Reservation!
    reservationDeleted: [ID!]!
  }
`;

export default typeDefs;
