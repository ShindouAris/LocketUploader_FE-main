import React, { useContext, useEffect, useRef, useState } from "react";
import { Camera, Download, SwitchCamera, Aperture, CircleSlash, Send, FolderOpen } from 'lucide-react';
import styles from "./CameraView.scss";
import classNames from "classnames/bind";
import * as lockerService from "~/services/locketService";
import { toast } from "react-toastify";
import constants from "~/services/constants";
import CompressorImage from "~/utils/imageUtils";
import { AuthContext } from "~/contexts/AuthContext";
import * as miscFuncs from "~/helper/misc-functions";
import LoginModal from "~/components/Modals/Login/LoginModal";
import images from "~/assets/images";
import { useNavigate } from "react-router-dom";

const cx = classNames.bind(styles);

const CameraView = () => {

    const { user, setUser } = useContext(AuthContext);
    const [isShowModal, setIsShowModal] = useState(false);

    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');
    const [isMobile, setIsMobile] = useState(false);
    const [file, setFile] = useState(null);
    const [caption, setCaption] = useState("");
    const [IsUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const mobileDevices = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
            setIsMobile(mobileDevices.test(userAgent));
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const startCamera = async (mode = facingMode) => {
        try {
            if (stream) {
                stopCamera();
            }

            const constraints = {
                video: {
                    facingMode: mode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
            setFacingMode(newFacingMode);
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: newFacingMode,
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (fallbackErr) {
                console.error("Error accessing any camera:", fallbackErr);
                toast.error("Có vẻ không có camera nào có thể sử dụng được..", {...constants.toastSettings})
            }
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    };

    const switchCamera = async () => {
        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacingMode);
        stopCamera();
        await startCamera(newFacingMode);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                setCapturedImage(canvas.toDataURL('image/jpeg'));
                setFile(blobtoFile(dataURLtoBlob(canvas.toDataURL('image/jpeg'))));
                stopCamera();
            }
        }
    };

    const retakePhoto = async () => {
        setCapturedImage(null);
        setCaption("")
        await startCamera();
    };

    const dataURLtoBlob = (dataURL: string): Blob => {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const blobtoFile = (blob: Blob) => {
        return new File([blob], "kanaket-photo.jpg",{ type: 'image/jpeg' });
    }

    const downloadImage = () => {
        if (capturedImage) {
            const blob = dataURLtoBlob(capturedImage);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const datetime = new Date().toISOString().replace(/[:.]/g, '-');
            link.href = url;
            link.download = `${datetime}-kanaket.jpg`;
            link.click();
        }
    };

    const handleUploadFile = async () => {
        console.log("Upload button clicked")
        if (file) {
            let compressedfile = await CompressorImage(file)
            compressedfile = blobtoFile(compressedfile);
            setIsUploading(true);
            lockerService
                .uploadMedia(compressedfile, caption, showToastPleaseWait)
                .then((res) => {
                    if (res) {
                        retakePhoto();
                        setCaption("");
                        setIsUploading(false);

                        toast.success(`Tải ảnh lên thành công`, {
                            ...constants.toastSettings,
                        });
                    }
                })
                .catch((error) => {
                    let message =
                        error?.response?.data?.error?.message ||
                        "Tải lên thất bại";

                    console.error(message);
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

    const back_to_upload = () => {
        if (stream) {
            stopCamera();
        }
        setCapturedImage(null);
        setCaption("");
        navigate("/");
    }

    return (

        <div className={cx("camera")}>
            {user ? (
                <>
                <div className={cx("camera_container")}>
                    <div className={cx("camera_viewport")}>
                        {!capturedImage ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    onLoadedMetadata={() => videoRef.current?.play()}
                                />
                                {!stream && (
                                    <div className={cx("start_stream")}>
                                        <button
                                            onClick={startCamera}
                                            className={cx("camera_start-btn")}
                                        >
                                            <Camera size={24} />
                                            Start Camera
                                        </button>
                                    </div>
                                )}
                                {stream && isMobile && (
                                    <button
                                        onClick={switchCamera}
                                        className={cx("camera_switch-btn")}
                                    >
                                        <SwitchCamera size={24} />
                                    </button>
                                )}
                            </>
                        ) : (
                            <img src={capturedImage} alt="Captured" />
                        )}
                    </div>
                    {capturedImage && (
                        <div className={cx("caption-input")}>
                            <input
                                type="text"
                                className={cx("post-title")}
                                placeholder="Nhập caption :>"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                            />
                        </div>)}
                    <div className={cx("camera_actions")}>
                        {stream && !capturedImage && (
                            <button
                                onClick={capturePhoto}
                                className={cx("camera_capture-btn")}
                            >
                                <Aperture  size={50} />
                            </button>
                        )}

                        {capturedImage && (
                            <div className={cx("camera_actions-container")}>
                                <div className={cx("camera_actions-btn")}>
                                    <button
                                        onClick={retakePhoto}
                                        className={cx("camera_retake-btn")}
                                    >
                                        <CircleSlash  size={30} />
                                    </button>
                                    <button className={cx("upload-image-btn")} disabled={IsUploading} onClick={handleUploadFile}>
                                        <Send size={30}/>
                                    </button>
                                    <button
                                        onClick={downloadImage}
                                        className={cx("camera_download-btn")}
                                    >
                                        <Download size={30} />
                                    </button>
                                </div>
                            </div>
                        )}
                        <button className={cx("backtoupload")} disabled={IsUploading} onClick={back_to_upload}>
                                <FolderOpen size={30} />
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
    );


}

export default CameraView;