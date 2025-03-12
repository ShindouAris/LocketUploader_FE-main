import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "./Upload.module.scss";
import classNames from "classnames/bind";
import { toast } from "react-toastify";

import { AuthContext } from "~/contexts/AuthContext";
import constants from "~/services/constants";
import images from "~/assets/images";
import LoginModal from "../Modals/Login/LoginModal";
import * as miscFuncs from "~/helper/misc-functions";
import * as lockerService from "~/services/locketService";
import Help from "../Modals/Login/Help";
import VideoCroppingutils from "~/utils/videoUtils";
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
    const { user, setUser } = useContext(AuthContext);

    const [file, setFile] = useState(null);
    const [caption, setCaption] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [isShowModal, setIsShowModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileRef = useRef(null);

    const [enable_cropping, setIsEnableCropping] = useState(false);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleAfterLogin = (userInfo) => {
        setIsShowModal(false);
        setUser(userInfo.user);

        toast.dismiss();
        toast.success("Đăng nhập thành công", {
            ...constants.toastSettings,
        });
        // Lưu vào cookie
        miscFuncs.setCookie("user", JSON.stringify(userInfo.user), 1);
    };

    const handleTriggerUploadFile = () => {
        fileRef.current.click();
    };

    const fileHandler = async (files) => {
        if (files?.length) {
            let selectedFile = files[0];

            if (selectedFile.type.includes("image")) {
                selectedFile = await autoCropImage(selectedFile);
                if (enable_cropping) {
                    toast.warning("Vô hiệu hóa CropVideo vì bạn đã chọn ảnh...", {...constants.toastSettings})
                    setIsEnableCropping(false)
                }
            }
            else {
                if (enable_cropping) {
                    toast.info("Chờ chút, đang xử lý video...", {...constants.toastSettings})
                    selectedFile = await VideoCroppingutils(selectedFile);
                }
            }

            const objectUrl = URL.createObjectURL(selectedFile);
            setFile(selectedFile);
            setPreviewUrl(objectUrl);
        }
    }

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

    const handleUploadFile = () => {
        const fileType = file.type.includes("image") ? "ảnh" : "video";
        if (file) {
            setIsUploading(true);
            lockerService
                .uploadMedia(file, caption, showToastPleaseWait)
                .then((res) => {
                    if (res) {
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
        <div className={cx("wrapper")}>
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
                        <div className={cx("croptitle")} >🛠️ CropVideo (Đang thử nghiệm)</div>
                        <div className={cx("enable_cropping_video_btn")} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button onClick={() => setIsEnableCropping(!enable_cropping)} className={`${styles.button} ${enable_cropping ? styles.active : styles.inactive}`} disabled={previewUrl? "disabled" : ""}>
                                {enable_cropping? "✅" : "❌"}
                            </button>
                            <span className={`${styles.warn_text}`}>
                                {previewUrl? "Tính năng không khả dụng" : `${enable_cropping ? "⚠️ Đang bật crop video, Upload không khả dụng" : ""}`}

                            </span>
                        </div>
                        <div
                            className={cx("upload-area")}
                            onDragOver={handleDragOver}
                            onDrop={handleSelectFileFromDrop}
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
                                        Drag and Drop file here or{" "}
                                        <button
                                            className={cx("underline")}
                                            onClick={handleTriggerUploadFile}
                                        >
                                            Choose file
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
                                    disabled={
                                        previewUrl && caption && !isUploading && !enable_cropping
                                            ? ""
                                            : "disable"
                                    }
                                    className={cx("btn-submit", {
                                        "is-loading": isUploading,
                                    })}
                                    onClick={handleUploadFile}
                                >
                                    <span>Submit</span>
                                    {isUploading && (
                                        <img
                                            src={images.spinner}
                                            alt="spinner"
                                            className={cx("spinner")}
                                        />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={cx("no-login")}>
                        <h3>Vui lòng đăng nhập để tiếp tục</h3>
                        <button
                            className={cx("btn-login")}
                            onClick={() => setIsShowModal(true)}
                        >
                            Đăng nhập
                        </button>
                        <LoginModal
                            handleAfterLogin={handleAfterLogin}
                            show={isShowModal}
                            onHide={() => setIsShowModal(false)}
                            onPleaseWait={showToastPleaseWait}
                        />
                        <img className={cx("pls_login_image")} src={images.pls_login} alt="pls_login_img" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Upload;
