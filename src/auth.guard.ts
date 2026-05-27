import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config/dist/config.service";

@Injectable()
export class AuthGuard implements CanActivate {
    logger = new Logger(this.constructor.name);
    authApiURL: string;
    httpService = new HttpService();

    constructor(
        private readonly configService: ConfigService
    ) {
        this.authApiURL = this.configService.get('authApiUrl') || "http://localhost:3001";
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (this.configService.get('useAuthGuard') === true) {
            const request = context.switchToHttp().getRequest();
            const token = this.extractTokenFromHeader(request);
            this.logger.debug(`Extracted token: ${token}`);

            if (!token) {
                throw new UnauthorizedException();
            }

            const url = `${this.authApiURL}/access/validate?token=${token}`;
            this.logger.debug(`Validating token with URL: ${url}`);

            const response = await this.httpService.axiosRef.get(url)
                .catch(error => {
                    this.logger.error(`Error validating token: ${error}`);
                    throw new ForbiddenException("Validate Token failed");
                })

            this.logger.debug(`Token validation response: ${JSON.stringify(response?.data)}`);
            return true;
        } else {
            return true;
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === "Bearer" ? token : undefined;
    }
}