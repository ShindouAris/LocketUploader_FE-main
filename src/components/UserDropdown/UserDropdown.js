import React, { useContext } from "react";
import PropTypes from "prop-types";
import styles from "./UserDropdown.module.scss"
import classNames from "classnames/bind";
import { deleteCookie } from "~/helper/misc-functions";
import { AuthContext } from "~/contexts/AuthContext";
import images from "~/assets/images";
const cx = classNames.bind(styles);

const UserDropdown = () => {
    const { setUser } = useContext(AuthContext);

    const handleLogout = () => {
        deleteCookie("user");
        setUser(null);
    };

    return (
        <button
            onClick={handleLogout}
            className={cx("logout-btn")}
        >
            <img
                src={images.logout_alt}
                alt="kanadeimg"
                className={cx("kanadeimage")}
            />
            <span className={cx("logout-txt")}>Đăng xuất</span>
        </button>
    );
};

UserDropdown.propTypes = {
    userInfo: PropTypes.object,
    className: PropTypes.string,
};

export default UserDropdown;
