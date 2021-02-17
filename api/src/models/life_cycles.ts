import mongoose, { Schema, Document } from 'mongoose';
const keys = require('../config/keys')

// модель словаря результатов расчета сервиса жизненного цикла 2
export interface ICalc2Result {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ICalc2Result & Document>('life_cycles', entrySchema);