import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель данных статистики для Анализа соответствия выявляемых нарушений бригад времени работы
*/

export interface ICrews_1_Reports {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ICrews_1_Reports & Document>('crews_1_reports', entrySchema);