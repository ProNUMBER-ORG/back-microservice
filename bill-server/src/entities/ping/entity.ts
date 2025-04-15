import { Column, PrimaryGeneratedColumn } from "typeorm";

export class Ping {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar" })
    title: string;
}
