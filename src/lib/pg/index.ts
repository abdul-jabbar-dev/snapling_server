import { PrismaClient } from "@prisma/client";

class PG {
  private pg: PrismaClient | undefined;

  constructor() {
    this.pg = new PrismaClient();
  }
  get DB() {
    if (this.pg instanceof PrismaClient) {
      return this.pg;
    } else {
      return new PrismaClient();
    }
  }
}


const PRISMA = new PG()
export default PRISMA