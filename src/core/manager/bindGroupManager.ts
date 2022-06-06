import { MaterialData } from '../data/material';
import { XortEntity } from '../entity';
import { Xort } from '../xort';
import { BaseManager } from './baseManager';
import { TransformComponent } from '../../of/extends/component/transform';
import { CameraComponent } from '../component/camera';

export const DataType = {
    float: 'f32',
    int: 'i32',
    uint: 'u32',
    bool: 'bool',

    vec2: 'vec2<f32>',
    ivec2: 'vec2<i32>',
    uvec2: 'vec2<u32>',
    bvec2: 'vec2<bool>',

    vec3: 'vec3<f32>',
    ivec3: 'vec3<i32>',
    uvec3: 'vec3<u32>',
    bvec3: 'vec3<bool>',

    vec4: 'vec4<f32>',
    ivec4: 'vec4<i32>',
    uvec4: 'vec4<u32>',
    bvec4: 'vec4<bool>',

    mat3: 'mat3x3<f32>',
    imat3: 'mat3x3<i32>',
    umat3: 'mat3x3<u32>',
    bmat3: 'mat3x3<bool>',

    mat4: 'mat4x4<f32>',
    imat4: 'mat4x4<i32>',
    umat4: 'mat4x4<u32>',
    bmat4: 'mat4x4<bool>'
}

export class BindGroupManager extends BaseManager {

    constructor(xort: Xort) {
        super(xort);

    }

    setupData(device: GPUDevice, buffer: GPUBuffer, camera: CameraComponent, transfrom: TransformComponent) {
        /** 
         * struct TransformUniform {     
         *     modelMatrix: mat4x4<f32>;
         *     modelViewMatrix: mat4x4<f32>;
         *     projectionMatrix: mat4x4<f32>;
         *     viewMatrix: mat4x4<f32>;
         *     normalMatrix: mat3x3<f32>;
         *     cameraPosition: vec3<f32>;
         * }
         */
        transfrom._matWorld.elements;
        const data = new Float32Array();
        data.set(transfrom._matWorld.elements, 0);
        data.set(transfrom._modelViewMat.elements, 16);
        data.set(camera.projectionMat.elements, 32)
        data.set(camera.modelViewMat.elements, 32)
        device.queue.writeBuffer(buffer, 0, data);
    }

    acquire(entity: XortEntity): GPUBindGroup {
        const cache = this.get(entity);
        let currentBindGroup;
        if (this._needsUpdate(entity, cache)) {
            const pipeline: GPURenderPipeline = this.xort.renderpipelineManager.acquire(entity);
            currentBindGroup = this.create(entity, pipeline);
            this.add(entity, currentBindGroup);

        } else {
            currentBindGroup = cache;
        }

        return currentBindGroup;
    }

    private _needsUpdate(_object: XortEntity, _cache: any) {
        return true;
    }


    create(entity: XortEntity, pipeline: GPURenderPipeline) {
        const material: MaterialData = entity.material?._asset as any;
        const device = this.xort._vision.device;

        device.createBuffer({
            size: 292, //(16x4+9) x4
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        })

        const entries: GPUBindGroupEntry[] = [];
        entries.push(this._createTransfromBuffer());


        const bindGroupLayout = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: entries
        })

        return bindGroupLayout;
    }


    private _createTransfromBuffer(): GPUBindGroupEntry {
        /**
         * 
         * struct TransformUniform {     
         *     modelMatrix: mat4x4<f32>;
         *     modelViewMatrix: mat4x4<f32>;
         *     projectionMatrix: mat4x4<f32>;
         *     viewMatrix: mat4x4<f32>;
         *     normalMatrix: mat3x3<f32>;
         *     cameraPosition: vec3<f32>;
         * }
         */
        const device = this.xort._vision.device;

        const size = 16 * 4 * 4 + 9 * 4 + 3 * 4;
        const transfromUniformBuffer: GPUBuffer = device.createBuffer({
            size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        return {
            binding: 0,
            resource: {
                buffer: transfromUniformBuffer,
                offset: 0,
                size: size
            }
        }
    }
}