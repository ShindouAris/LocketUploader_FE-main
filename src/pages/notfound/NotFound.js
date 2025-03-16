import React from "react";
import styles from "./NotFound.scss";
import classNames from "classnames/bind";
import images from "~/assets/images";
import { useNavigate } from "react-router-dom";

const cx = classNames.bind(styles);

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div className={cx("main")}>
            <h1 id={cx("stillpage")}>Not Found</h1>
            <p id={cx("thosewhoknow")}>Where u going?</p>
            <img src={images.notfound} id={cx("mikugifidk")} alt="Miku GIF" />
            <button onClick={() => {navigate("/");}} className={cx("back")}>
                Back to the basements
            </button>
            <h2 id={cx("notfoundcodetextidk")}>404 - Not Found</h2>
            <p id={cx("bottomtext")}>HOW DID U GET HERE</p>
        </div>
    );
};

export default NotFound;
