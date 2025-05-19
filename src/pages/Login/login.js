import LoginModal from "~/components/Modals/Login/LoginModal";
import images from "~/assets/images";
import { Info, PowerOff } from "lucide-react";
import React, { useContext, useState } from "react";
import classNames from "classnames/bind";
import styles from "./Login.module.scss";
import { toast } from "react-toastify";
import constants from "~/services/constants";
import * as miscFuncs from "~/helper/misc-functions";
import { AuthContext } from "~/contexts/AuthContext";
import { useNavigate } from "react-router-dom";


const cx = classNames.bind(styles);


const Login = () => {

    const [isShowModal, setIsShowModal] = useState(false);
    const { setUser } = useContext(AuthContext);
    const nav = useNavigate();

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
        nav("/");
    };

    return (
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
            <div className={cx("infomation-card")}>
                <h4 className={cx("infomation-text")}>
                        <Info size={20} /> Thông báo
                </h4>
                <span className={cx("shutdown_web_message")}>
                                <PowerOff size={14} /> Web sẽ đóng cửa sau khi locket gold trên android được cập nhật <br/>
                                 Cảm ơn các bạn đã sử dụng các dịch vụ của Kanaket 💛
                </span>
            </div>
        </div>
    )
}

export default Login;