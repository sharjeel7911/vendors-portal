import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn({ type: 'int4' })
  id: number | undefined;

  @Column({ type: 'int4' })
  vendor_id: number | undefined;

  @Column({ type: 'varchar' })
  type: string | undefined;

  @Column({ type: 'int4' })
  capacity: number | undefined;

  @Column({ type: 'varchar' })
  depot: string | undefined;

  @Column({ type: 'varchar' })
  plate_no: string | undefined;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date | undefined;

  @Column({ type: 'bool', default: true })
  isAvailable: boolean | undefined;
}
