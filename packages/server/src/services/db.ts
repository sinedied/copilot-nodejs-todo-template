import { CosmosClient } from '@azure/cosmos';
import { Task } from '../models/task';

/**
 * Service for interacting with the database.
 * This is singleton class, so only one instance will be created.
 * It uses Azure Cosmos DB to store tasks.
 * @class
 * @constructor
 * @public
 * @singleton
 * @property {CosmosClient} client - The Cosmos DB client.
 * @property {string} databaseId - The ID of the database.
 * @property {string} containerId - The ID of the container.
 * @method getTasks - Get all tasks for a user.
 * @method createTask - Create a new task.
 * @method getTask - Get a task by ID.
 * @method updateTask - Update a task.
 * @method deleteTask - Delete a task.
 */
export class DbService {
  private client: CosmosClient;
  private databaseId: string = 'todos';
  private containerId: string = 'tasks';

  private static instance: DbService;

  static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }

    return DbService.instance;
  }

  constructor() {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;

    if (!endpoint || !key) {
      throw new Error('Missing COSMOS_ENDPOINT or COSMOS_KEY environment variable');
    }

    this.client = new CosmosClient({ endpoint, key });
  }

  async getTasks(userId: string): Promise<Task[]> {
    const { resources } = await this.client
      .database(this.databaseId)
      .container(this.containerId)
      .items.query({
        query: 'SELECT * from c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }]
      })
      .fetchAll();

    return resources;
  }

  async createTask(task: Task): Promise<Task> {
    const { resource } = await this.client
      .database(this.databaseId)
      .container(this.containerId)
      .items.create(task);

    if (!resource) {
      throw new Error('Failed to create task');
    }

    return resource;
  }

  async getTask(taskId: string): Promise<Task> {
    const { resource } = await this.client
      .database(this.databaseId)
      .container(this.containerId)
      .item(taskId)
      .read<Task>();

    if (!resource) {
      throw new Error('Task not found');
    }

    return resource;
  }

  async updateTask(task: Task): Promise<Task> {
    const { resource } = await this.client
      .database(this.databaseId)
      .container(this.containerId)
      .item(task.id)
      .replace(task);

    if (!resource) {
      throw new Error('Failed to update task');
    }

    return resource;
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.client
      .database(this.databaseId)
      .container(this.containerId)
      .item(taskId)
      .delete();
  }
}
