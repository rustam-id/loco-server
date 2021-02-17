import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель по пробегу локомотива
*/

export interface ILocoCards {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ILocoCards & Document>('loco_cards', entrySchema);