import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель по оборудованию для цифрового двойника 
*/

export interface ILocoEquips {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ILocoEquips & Document>('loco_equips', entrySchema);