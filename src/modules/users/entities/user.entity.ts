import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  public id!: string

  @Column({ unique: true })
  public email!: string

  @Column()
  public name!: string

  @Column()
  public password!: string

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  public role!: Role

  @CreateDateColumn()
  public createdAt!: Date

  @UpdateDateColumn()
  public updatedAt!: Date
}
