import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель по Уровням аномальности двигателей на секции
*/

export interface ILocoErrs {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ILocoErrs & Document>('loco_errs', entrySchema);