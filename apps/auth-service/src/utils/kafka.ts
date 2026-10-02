import { createKafkaClient, createProducer } from "@repo/kafka/src";

const kafka = createKafkaClient("email-service");
export const producer = createProducer(kafka);