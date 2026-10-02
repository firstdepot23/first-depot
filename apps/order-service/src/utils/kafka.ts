import { createConsumer, createKafkaClient, createProducer } from "@repo/kafka/src";

const kafkaClient = createKafkaClient("order-service");

export const producer = createProducer(kafkaClient);
export const consumer = createConsumer(kafkaClient, "order-group");