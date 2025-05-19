import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "./Upload.module.scss";
import classNames from "classnames/bind";
import { toast } from "react-toastify";
import { Camera } from "lucide-react";

import { AuthContext } from "~/contexts/AuthContext";
import constants from "~/services/constants";
import images from "~/assets/images";
import * as lockerService from "~/services/locketService";
import Help from "../Modals/Login/Help";
import VideoCroppingutils from "~/utils/videoUtils";
import CompressorImage from "~/utils/imageUtils";
import { Navigate, useNavigate } from "react-router-dom";

const cx = classNames.bind(styles);

// ChatGPT !!
const autoCropImage = async (imageFile) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                const size = Math.min(img.width, img.height);
                canvas.width = size;
                canvas.height = size;

                ctx.drawImage(
                    img,
                    (img.width - size) / 2,
                    (img.height - size) / 2,
                    size,
                    size,
                    0,
                    0,
                    size,
                    size
                );

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], imageFile.name, { type: "image/jpeg" }));
                    } else {
                        reject(new Error("Image cropping failed"));
                    }
                }, "image/jpeg");
            };

            img.onerror = () => reject(new Error("Failed to load image"));
        };

        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(imageFile);
    });
};


const Upload = () => {
    const { user } = useContext(AuthContext);

    const [file, setFile] = useState(null);
    const [caption, setCaption] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileRef = useRef(null);
    const navigate = useNavigate();

    const [enable_cropping, setIsEnableCropping] = useState(false);
    const [cropImage, setCropImage] = useState(false);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleTriggerUploadFile = () => {
        fileRef.current.click();
    };

    const fileHandler = async (files) => {
        if (files?.length) {
            let selectedFile = files[0];

            if (selectedFile.type.includes("video")) {
                if (selectedFile.size > 5 * 1024 * 1024) {
                    toast.error("File quá lớn (tối đa 5MB)", {...constants.toastSettings});
                    return;
                }
                const videoElement = document.createElement("video");
                videoElement.preload = "metadata";

                videoElement.onloadedmetadata = async () => {
                    window.URL.revokeObjectURL(videoElement.src);

                    if (videoElement.duration > 3) {
                        toast.error("Video quá dài (tối đa 3 giây)", {...constants.toastSettings});
                        return;
                    }

                    if (enable_cropping) {
                        toast.info("Chờ chút, đang xử lý video...", {...constants.toastSettings});
                        selectedFile = await VideoCroppingutils(selectedFile);
                    }

                    if (!selectedFile.type.includes("video")) {
                        toast.error("File không hợp lệ", {...constants.toastSettings});
                        return;
                    }

                    const objectUrl = URL.createObjectURL(selectedFile);
                    setFile(selectedFile);
                    setPreviewUrl(objectUrl);
                };

                videoElement.src = URL.createObjectURL(selectedFile);
            } else if (selectedFile.type.includes("image")) {

                if ((selectedFile.size > 5 * 1024 * 1024) && !cropImage) {
                    toast.error("File quá lớn (tối đa 1MB)", {...constants.toastSettings});
                    return;
                }
                if (enable_cropping) {
                    toast.warning("Vô hiệu hóa CropVideo vì bạn đã chọn ảnh...", {...constants.toastSettings});
                    setIsEnableCropping(false);
                }
                if (cropImage) {
                    toast.info("Đang nén ảnh..", {...constants.toastSettings});
                    try {
                        let imagecropping = await CompressorImage(selectedFile);
                        if (!(imagecropping instanceof Blob)) {
                            toast.error(`Đã xảy ra lỗi...`, {...constants.toastSettings});
                        }
                    }
                    catch (error) {
                        toast.error(error.message);
                        console.log(error.message);
                    }
                }

                selectedFile = await autoCropImage(selectedFile);
                const objectUrl = URL.createObjectURL(selectedFile);
                setFile(selectedFile);
                setPreviewUrl(objectUrl);
            } else {
                if (selectedFile.size > 5 * 1024 * 1024) {
                    toast.error("File quá lớn (tối đa 5MB)", {...constants.toastSettings});
                    return;
                }
                toast.error("File không hợp lệ", {...constants.toastSettings});
            }
        }
    };

    const handlePaste = async (e) => {
        e.preventDefault();

        if (!e.clipboardData || !e.clipboardData.items) {
            toast.error("Không tìm thấy dữ liệu từ clipboard.", { ...constants.toastSettings });
            return;
        }

        const items = e.clipboardData.items;
        let fetched = false;

        for (let item of items) {
            if (item.kind === "file" && item.type.startsWith("image/")) {
                fetched = true;
                const file = item.getAsFile();
                await fileHandler([file]);
                return;
            }
        }

        if (!fetched && user) {
            toast.warning("Dữ liệu dán không phải là hình ảnh!", { ...constants.toastSettings });
        }
    };

    const handleSelectFile = async (e) => {
        const { files } = e.target;
        await fileHandler(files)
    };

    const handleDragOver = (e) => {
        // Ngăn chặn hành động mặc định của thẻ HTML để cho phép thả file vào
        e.preventDefault();
    };

    const handleSelectFileFromDrop = async (e) => {
        e.preventDefault();
        const { files } = e.dataTransfer;
        await fileHandler(files)
    };

    const toggleUseCamera = () => {
        navigate("/camera")
    }

    const handleUploadFile = () => {
        const fileType = file.type.includes("image") ? "ảnh" : "video";
        if (file) {
            setIsUploading(true);
            lockerService
                .uploadMedia(file, caption, showToastPleaseWait)
                .then((res) => {
                    if (res) {
                        setUploadSuccess(true);
                        setTimeout(() => {
                            setUploadSuccess(false);
                        }, 2500);
                        setPreviewUrl("");
                        setCaption("");
                        setIsUploading(false);

                        toast.success(`Tải ${fileType} lên thành công`, {
                            ...constants.toastSettings,
                        });
                    }
                })
                .catch((error) => {
                    let message =
                        error?.response?.data?.error?.message ||
                        "Tải lên thất bại";

                    if (message === "Failed to upload image: Forbidden") {
                        if (fileType === "video") {
                            message = `${fileType} của bạn đã dài quá 3s hoặc nặng quá 5mb, hãy nén / cắt và thử lại :>`
                        }
                        else {
                            message = `${fileType} của bạn đã vượt quá giới hạn tải lên, hãy nén nó xuống dưới 1mb nhé :>`;
                        }

                    }
                    setIsUploading(false);
                    toast.error(message, {
                        ...constants.toastSettings,
                    });
                });
        }
    };

    const showToastPleaseWait = () => {
        toast.dismiss();
        toast.info(
            "Đợi chút, đang kết nối đến máy chủ để xử lý. ",
            {
                ...constants.toastSettings,
            },
        );
    };

    return (
        <div className={cx("wrapper")} onPaste={handlePaste}>
            <div className={cx("card")}>
                {user ? (
                    <>
                        <h2 className={cx("title")}>Tải ảnh hoặc video lên</h2>
                        <div className={cx("input-container")}>
                            <input
                                type="text"
                                className={cx("post-title")}
                                placeholder="Nhập caption :>"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                            />
                        </div>
                        <div className={cx("tool-box")}>
                        <div className={cx("option-container")}>
                        <div className={cx("croptitle")} >🛠️ CropVideo (Đang thử nghiệm)</div>
                        <div className={cx("enable_cropping_video_btn")} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button onClick={() => setIsEnableCropping(!enable_cropping)} className={`${styles.button} ${enable_cropping ? styles.active : styles.inactive}`} disabled={previewUrl || cropImage? "disabled" : ""}>
                                {enable_cropping? "✅" : "❌"}
                            </button>
                            <span className={`${styles.warn_text}`}>
                                {previewUrl? "" : `${enable_cropping ? "⚠️ Đang bật crop video" : `${cropImage ? "⚠️ không khả dụng" : ""}`}`}
                            </span>
                        </div>
                        <div className={cx("croptitle")} >🛠️ Nén ảnh (Đang thử nghiệm)</div>
                        <div className={cx("image_compress_btn")} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button onClick={() => setCropImage(!cropImage)} className={`${styles.button} ${cropImage ? styles.active : styles.inactive}`} disabled={previewUrl || enable_cropping ? "disabled" : ""}>
                                {cropImage? "✅" : "❌"}
                            </button>
                            <span className={`${styles.warn_text}`}>
                                {previewUrl? "" : `${cropImage ? "⚠️ Đang bật nén ảnh" : `${enable_cropping ? "⚠️ Không khả dụng" : ""}`}`}
                            </span>
                        </div>
                        </div>
                            {!cropImage && !enable_cropping && !previewUrl ? (<div className={cx("toggle-camera")}>
                                <div className={cx("use-camera-title")}>📷 Sử dụng Camera</div>
                                <button className={cx("toggle-camera-btn")} onClick={toggleUseCamera}>
                                    <Camera size={30} />
                                </button>
                            </div>) : ""}
                        </div>
                        <div
                            className={cx("upload-area")}
                            onDragOver={handleDragOver}
                            onDrop={handleSelectFileFromDrop}
                            onPaste={handlePaste}
                            role="button"
                            tabIndex="0"
                        >
                            {previewUrl ? (
                                <div className={cx("preview-wrapper")}>
                                    {file.type.includes("image") ? (
                                        <img
                                            src={previewUrl}
                                            alt="preview"
                                            className={cx("preview-image")}
                                        />
                                    ) : (
                                        <video
                                            src={previewUrl}
                                            alt="preview"
                                            className={cx("preview-video")}
                                            controls
                                        >
                                            <track
                                                kind="captions"
                                                src="captions.vtt"
                                                label="English"
                                            />
                                        </video>
                                    )}
                                    <button
                                        className={cx("btn-delete-preview")}
                                        onClick={() => setPreviewUrl("")}
                                    >
                                        <span>&times;</span>
                                    </button>
                                </div>
                            ) : (
                                <div className={cx("content")}>
                                    <button onClick={handleTriggerUploadFile}>
                                        <img
                                            src={images.mediaUpload}
                                            alt="upload"
                                            className={cx("upload-icon")}
                                        />
                                    </button>
                                    <h3>
                                        Kéo thả tệp, Dán tệp hoặc{" "}
                                        <button
                                            className={cx("underline")}
                                            onClick={handleTriggerUploadFile}
                                        >
                                            Chọn tệp
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileRef}
                                            onChange={handleSelectFile}
                                            accept="image/*,video/*"
                                        />
                                    </h3>
                                </div>
                            )}
                        </div>
                        <div className={cx("actions")}>
                            <Help />
                            <div className={cx("buttons")}>
                                <button
                                    disabled={previewUrl && !isUploading && !uploadSuccess ? "" : "disable"}
                                    className={cx("btn-submit", {"is-loading": isUploading})}
                                    onClick={handleUploadFile}
                                    >
                                    <span>{!uploadSuccess? "Submit": "✅"}</span>
                                    {isUploading && (
                                        <img src={images.spinner} alt="spinner" className={cx("spinner")}
                                        />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <Navigate to={"/login"} replace={true} />
                )}
            </div>
        </div>
    );
};

export default Upload;
