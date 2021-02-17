import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель данных статистики для поступающих данных
*/

export interface ICrewsDataMonitoring {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ICrewsDataMonitoring & Document>('stats_entries_datas', entrySchema);