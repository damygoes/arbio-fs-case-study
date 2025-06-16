import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsers1640000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())'
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}