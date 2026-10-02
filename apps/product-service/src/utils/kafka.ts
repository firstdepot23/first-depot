import { createConsumer, createKafkaClient, createProducer } from "@repo/kafka/src";

const kafkaClient = createKafkaClient("product-service");

export const producer = createProducer(kafkaClient);
export const consumer = createConsumer(kafkaClient, "product-group");