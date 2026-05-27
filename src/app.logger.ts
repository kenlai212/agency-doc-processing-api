import { Injectable, LoggerService } from "@nestjs/common";
import { trace } from "@opentelemetry/api";

function getTraceContext() {
    const span = trace.getActiveSpan();
    const ctx = span?.spanContext();
    if (!ctx) {
        return null;
    } else {
        return {
            traceId: ctx.traceId,
            spanId: ctx.spanId,
        }
    }
}

@Injectable()
export class AppLogger implements LoggerService {
    log(message: string, ...optionalParams: any[]) {
        console.log(`[LOG][traceContext: ${JSON.stringify(getTraceContext())}][${optionalParams}] ${message}`);
    }

    error(message: any, ...optionalParams: any[]) {
        console.error(`[ERROR][traceContext: ${JSON.stringify(getTraceContext())}][${optionalParams}] ${message}`);
    }

    warn(message: any, ...optionalParams: any[]) {
        console.warn(`[WARN][traceContext: ${JSON.stringify(getTraceContext())}][${optionalParams}] ${message}`);
    }

    debug(message: any, ...optionalParams: any[]) {
        console.warn(`[DEBUG][traceContext: ${JSON.stringify(getTraceContext())}][${optionalParams}] ${message}`);
    }
}