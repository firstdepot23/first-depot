import { consumer } from "./kafka";
import { createStripeProduct, deleteStripeProduct } from "./stripeProduct";

export const runKafkaSubscriptions = async () => {
  consumer.subscribe([
    {
      topicName: "product.created",
      topicHandler: async (message) => {
        const product = message.value;
        console.log("Received message: product.created", product);

        try {
          await createStripeProduct(product);
        } catch (error) {
          console.error("Failed to create Stripe product:", product, error);
        }
      },
    },
    {
      topicName: "product.deleted",
      topicHandler: async (message) => {
        const productId = message.value;
        console.log("Received message: product.deleted", productId);

        try {
          await deleteStripeProduct(productId);
        } catch (error) {
          console.error("Failed to archive Stripe product:", productId, error);
        }
      },
    },
  ]);
};