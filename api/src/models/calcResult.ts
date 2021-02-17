import mongoose, { Schema, Document } from 'mongoose';
const keys = require('../config/keys')

// модель словаря результатов расчета сервиса жизненного цикла
export interface ICalcResult {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });
// задаем индекс для автоматического удаления записи по указанному сроку
entrySchema.index({ createdAt: 1 }, { expireAfterSeconds: keys.mongo.timeToLiveSeconds })

export default mongoose.model<ICalcResult & Document>('calc_result', entrySchema);