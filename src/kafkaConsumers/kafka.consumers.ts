import { Injectable, Logger } from "@nestjs/common";
import { KafkaContext } from "@nestjs/microservices";

@Injectable()
export class KafkaConsumerService {
    readonly logger: Logger = new Logger(this.constructor.name)

    logInboundEvent(payload: any, context: KafkaContext) {
        const { offset } = context.getMessage();
        const topic = context.getTopic();
        const partition = context.getPartition();
        this.logger.log(
            `Received message from topic [${topic}] partition [${partition}] offset [${offset}]`
        );

        this.logger.log(`Payload: ${JSON.stringify(payload)}`);
    }

    async commitOffset(context: KafkaContext) {
        const { offset } = context.getMessage();
        const topic = context.getTopic();
        const partition = context.getPartition();
        await context
            .getConsumer()
            .commitOffsets([
                { topic, partition, offset: (parseInt(offset) + 1).toString() },
            ]);
    }
}