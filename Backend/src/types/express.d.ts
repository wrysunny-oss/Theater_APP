declare global {
  namespace Express {
    interface Request {
      auth?: { userId: bigint; permissions: string[] };
    }
  }
}
export {};
