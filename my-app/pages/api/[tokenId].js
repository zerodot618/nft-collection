export default function handler(req, res) {
    // 从查询参数中获取tokenId
    const tokenId = req.query.tokenId;
    // 由于所有的图片都上传至github，我们可以直接从github提取图片.
    const image_url =
        "https://raw.githubusercontent.com/zerodot618/nft-collection/main/my-app/public/zerodot618/";
    // 该api正在为一个ZeroDot618 发送回元数据
    // 为了使我们的收藏与Opensea兼容，我们需要遵循一些元数据标准
    // 当从api发回响应时
    // 更多信息可以在这里找到: https://docs.opensea.io/docs/metadata-standards
    res.status(200).json({
        name: "Crypto Dev #" + tokenId,
        description: "Crypto Dev is a collection of developers in crypto",
        image: image_url + tokenId + ".svg",
    });
}