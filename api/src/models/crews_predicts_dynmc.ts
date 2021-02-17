import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель с аргрегированными прогнозами по бригадам c машинистами
*/

export interface ICrewsPredictDynmc {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ICrewsPredictDynmc & Document>('crews_predicts_dynmc', entrySchema);