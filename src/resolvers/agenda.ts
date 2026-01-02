import { PubSub } from "graphql-subscriptions";
import { PrismaClient } from "@prisma/client";

const pubsub = new PubSub();
const prisma = new PrismaClient();

export default {
  Query: {
    // 🔹 Admin
    reservations: async () => {
      return prisma.reservation.findMany({
        orderBy: { date: "desc" },
      });
    },

    // 🔹 Calendário (PAGAS + NÃO PAGAS)
    calendarReservations: async () => {
      const reservations = await prisma.reservation.findMany({
        select: {
          date: true,
          paid: true,
        },
      });

      return reservations.map(r => ({
        date: r.date.toISOString().split("T")[0], // YYYY-MM-DD
        paid: r.paid,
      }));
    },

    // 🔹 Apenas pagas (opcional)
    blockedDates: async () => {
      const reservations = await prisma.reservation.findMany({
        where: { paid: true },
        select: { date: true },
      });

      return reservations.map(r =>
        r.date.toISOString().split("T")[0]
      );
    },
  },

  Mutation: {
    createReservation: async (_: any, { input }: any) => {
      const reservation = await prisma.reservation.create({
        data: {
          date: new Date(input.date),
          clientName: input.clientName,
          eventName: input.eventName,
          durationHours: input.durationHours,
          paid: false,
        },
      });

      pubsub.publish("RESERVATION_CREATED", {
        reservationCreated: reservation,
      });

      return reservation;
    },

    confirmPayment: async (_: any, { reservationId }: any) => {
      const paidReservation = await prisma.reservation.update({
        where: { id: reservationId },
        data: { paid: true },
      });

      const reservationsToDelete = await prisma.reservation.findMany({
        where: {
          date: paidReservation.date,
          paid: false,
          NOT: { id: reservationId },
        },
        select: { id: true },
      });

      const deletedIds = reservationsToDelete.map(r => r.id);

      if (deletedIds.length > 0) {
        await prisma.reservation.deleteMany({
          where: { id: { in: deletedIds } },
        });

        pubsub.publish("RESERVATION_DELETED", {
          reservationDeleted: deletedIds,
        });
      }

      pubsub.publish("PAYMENT_CONFIRMED", {
        paymentConfirmed: paidReservation,
      });

      return paidReservation;
    },

    removePayment: async (_: any, { reservationId }: any) => {
      const reservation = await prisma.reservation.update({
        where: { id: reservationId },
        data: { paid: false },
      });

      pubsub.publish("PAYMENT_REMOVED", {
        paymentRemoved: reservation,
      });

      return reservation;
    },
  },

  Subscription: {
    reservationCreated: {
      subscribe: () => pubsub.asyncIterator(["RESERVATION_CREATED"]),
    },
    paymentConfirmed: {
      subscribe: () => pubsub.asyncIterator(["PAYMENT_CONFIRMED"]),
    },
    paymentRemoved: {
      subscribe: () => pubsub.asyncIterator(["PAYMENT_REMOVED"]),
    },
    reservationDeleted: {
      subscribe: () => pubsub.asyncIterator(["RESERVATION_DELETED"]),
    },
  },
};
