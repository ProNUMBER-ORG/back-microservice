import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BillStatus } from "../../common/enums/bill-status";

@Entity()
export class Bill {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "integer", default: BillStatus.New, enum: BillStatus, nullable: false })
    status: number;

    @Column({ type: "varchar", nullable: true })
    link: string;

    @Column({ type: "jsonb", default: [], nullable: true })
    additional: any;

    @Column({ type: "jsonb", default: {}, nullable: true })
    error: any;
}
