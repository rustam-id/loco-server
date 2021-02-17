import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель по Вероятности выхода из строя двигателя
*/

export interface ILocoPredicts {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ILocoPredicts & Document>('loco_predicts', entrySchema);