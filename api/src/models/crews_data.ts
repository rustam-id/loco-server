import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель с нарушениями по бригадам
*/

export interface ICrewsData {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ICrewsData & Document>('crews_data', entrySchema);