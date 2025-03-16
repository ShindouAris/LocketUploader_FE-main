import React, {Component} from "react";
import styles from "./errorpage.scss";
import classNames from "classnames/bind";
import images from "~/assets/images";

const cx = classNames.bind(styles);

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(error) {
        return {hasError: true};
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`Hanling Error: ${error} - ${errorInfo}`);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className={cx("main")}>
                    <h1 id={cx("stillpage")}>Server Error :&lt;</h1>
                    <p id={cx("thosewhoknow")}>
                        The server encountered an internal error and was unable to complete your request.<br/>
                        Either the server is overloaded or there is an error in the application.
                    </p>
                    {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                    <img
                        src={images.internalError}
                        id={cx("mikugifidk")}
                        alt="image"
                    />
                    <h2 id={cx("notfoundcodetextidk")}>500 - Internal Server Error</h2>
                    <p id={cx("bottomtext")}>Server error, try again later :&lt;</p>
                </div>
            )
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
