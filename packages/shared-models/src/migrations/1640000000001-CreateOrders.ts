import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOrders1640000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders',
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
            name: 'userId',
            type: 'varchar',
            length: '36'
          },
          {
            name: 'totalAmount',
            type: 'decimal',
            precision: 10,
            scale: 2
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: "'pending'"
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true
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
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
          }
        ]
      }),
      true
    );

    // Add index on userId for better query performance
    await queryRunner.createIndex('orders', new TableIndex({
      name: 'IDX_ORDERS_USER_ID',
      columnNames: ['userId']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('orders');
  }
}