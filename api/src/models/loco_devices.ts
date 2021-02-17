import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель по названиям оборудования локомотива 
*/

export interface ILocoDevices {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ILocoDevices & Document>('loco_devices', entrySchema);