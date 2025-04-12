import CameraView from "~/components/Camera/camera";
import Header from "~/components/Header";
import React from "react";
import classNames from "classnames/bind";
import styles from "./Camera.scss";

const cx = classNames.bind(styles);

const CameraRoute = () => {
    return (
        <div className={cx("wrapper")}>
            <Header />
            <div className={cx("content")}>
                <CameraView />
            </div>
        </div>
    )
}

export default CameraRoute;