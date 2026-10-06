import { OrderType } from "@repo/types";
import { consumer } from "./kafka";
import { createOrder } from "./order";

export const runKafkaSubscriptions = async () => {
  await consumer.subscribe([
    {
      topicName: "payment.successful",
      topicHandler: async (message: { value: OrderType }) => {
        console.log(
          "payment.successful received:",
          JSON.stringify(message.value),
        );
        try {
          await createOrder(message.value);
        } catch (error) {
          console.error(
            "Could not create order from payment.successful:",
            error,
          );
        }
      },
    },
  ]);
};