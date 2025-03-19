import Compressor from 'compressorjs';

const CompressorImage = (image) => {
    return new Promise((resolve, reject) => {
        let quality = 1;
        let targetSize = 1024 * 1024;

        if (image.size > targetSize) {
            quality = targetSize / image.size;
            quality = Math.max(quality, 0.1);
        }

        new Compressor(image, {
            quality: quality,
            success(file) {
                if (file.size <= targetSize) {
                    resolve(file instanceof Blob ? file : new Blob([file], { type: 'image/png' }));
                } else {
                    reject(new Error("Không thể nén xuống 1MB với chất lượng tối thiểu."));
                }

            },
            error(error) {
                reject(error);
            }
        });
    });
};

export default CompressorImage;
