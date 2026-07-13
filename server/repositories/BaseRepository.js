export default class BaseRepository {
    constructor(collection) {
        this.collection = collection;
    }

    async findAll() {
        return [...this.collection];
    }

    async findById(id) {
        return this.collection.find(item => item.id === id);
    }

    async create(data) {
        this.collection.push(data);
        return data;
    }

    async update(id, data) {
        const index = this.collection.findIndex(item => item.id === id);

        if (index === -1)
            return null;

        this.collection[index] = {
            ...this.collection[index],
            ...data
        };

        return this.collection[index];
    }

    async delete(id) {
        const index = this.collection.findIndex(item => item.id === id);

        if (index === -1)
            return false;

        this.collection.splice(index, 1);

        return true;
    }
}