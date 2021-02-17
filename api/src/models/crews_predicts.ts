import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель с нарушениями по прогнозам
*/

export interface ICrewsPredict {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ICrewsPredict & Document>('crews_predicts', entrySchema);