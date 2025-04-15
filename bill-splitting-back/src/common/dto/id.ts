import { z } from "zod";

export const stringUUID = z.string().uuid();

export const idDto = z.object({ id: stringUUID });
