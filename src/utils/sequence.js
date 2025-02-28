
const getImageByIndex = async (apiService, index, quality, scale) => {
    console.log(apiService);
    try {
        const result = await apiService.getSequenceImage(
            index,
            quality,
            true,
            scale,
        );
        if (result.StatusCode != 200) {
            console.error('Unknown error: Check NINA Logs for more information');
            return;
        }
        const image = result?.Response;
        return image;
    } catch (error) {
        console.error(`An error happened while getting image with index ${index}`, error.message);
        return;
    }
}

module.exports = {
    getImageByIndex,
};
