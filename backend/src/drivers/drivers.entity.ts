import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn({ type: 'int4' })
  id: number | undefined;

  @Column({ type: 'int4' })
  vendor_id: number | undefined;

  @Column({ type: 'varchar' })
  name: string | undefined;

  @Column({ type: 'varchar' })
  phone: string | undefined;

  @Column({ type: 'varchar' })
  liscence_no: string | undefined;

  @Column({ type: 'varchar' })
  working_hours: string | undefined;

  @Column({ type: 'varchar' })
  status: string | undefined;

  @Column({ type: 'int4', nullable: true })
  vehicle_id: number | null | undefined;

  @Column({ type: 'float8' })
  latitude: number | undefined;

  @Column({ type: 'float8' })
  longitude: number | undefined;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date | undefined;
}
