import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreatePingTable1743583381260 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "ping",
                columns: [
                    { name: "id", type: "int", isPrimary: true },
                    { name: "title", type: "varchar", isNullable: true }
                ]
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("ping");
    }
}
