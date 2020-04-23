import vls from './vls.js';
import Common from './common.js';
import Static from './static.js';

class ModelOps {

    constructor() {
        this.getY(true);
    }

    getY(useCache) {
        var _this = this;
        return new Promise((resolve, reject) => {
            if (_this.y && useCache) {
                resolve(_this.y);
            } else {
                Y({
                    db: {
                        name: "memory" // store the shared data in memory
                    },
                    connector: {
                        name: "websockets-client", // use the websockets connector
                        room: Common.createYjsRoomNameWithSpace(Static.ERModelingSpaceId),
                        options: { resource: "{YJS_RESOURCE_PATH}"},
                        url:"{YJS_ADDRESS}"
                    },
                    share: { // specify the shared content
                        data: 'Map',
                        training: 'Richtext'
                    },
                    type:["Text","Map"],
                    sourceDir: '/bower_components'
                }).then(y => {
                    _this.y = y;
                    resolve(y);
                });
            }
        });
    }

    uploadMetaModel() {
        return this.getY(false).then(y => {
            return new Promise((resolve, reject) => {
                y.share.data.set('metamodel', vls);
                resolve();
            });
        });
    }
}

const instance = new ModelOps();
export default instance;
