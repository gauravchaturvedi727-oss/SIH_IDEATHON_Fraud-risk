import { useEffect, useRef, useState } from "react";

import api from "../services/api";

import "./NotificationCenter.css";


function NotificationCenter() {

    const [open, setOpen] = useState(false);

    const [notifications, setNotifications] =
        useState([]);

    const [unreadCount, setUnreadCount] =
        useState(0);

    const [loading, setLoading] =
        useState(false);

    const notificationRef =
        useRef(null);

    const fetchNotifications = async () => {

        try {

            setLoading(true);


            const response =
                await api.get("/notifications");


            setNotifications(
                response.data.notifications || []
            );


            setUnreadCount(
                response.data.unreadCount || 0
            );

        }
        catch (error) {

            console.error(
                "NOTIFICATION ERROR:",
                error.response?.data ||
                error.message
            );

        }
        finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        fetchNotifications();

    }, []);

    useEffect(() => {

        const interval = setInterval(() => {

            fetchNotifications();

        }, 10000);


        return () => {

            clearInterval(interval);

        };

    }, []);

    useEffect(() => {

        const handleClickOutside =
            (event) => {

                if (
                    notificationRef.current &&
                    !notificationRef.current.contains(
                        event.target
                    )
                ) {

                    setOpen(false);

                }

            };


        document.addEventListener(
            "mousedown",
            handleClickOutside
        );


        return () => {

            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );

        };

    }, []);

    const markAllAsRead = async () => {

        try {

            await api.put(
                "/notifications/read-all"
            );


            setNotifications(
                (previous) =>

                    previous.map(
                        (notification) => ({

                            ...notification,

                            read: true

                        })
                    )
            );


            setUnreadCount(0);

        }
        catch (error) {

            console.error(
                "MARK ALL READ ERROR:",
                error.response?.data ||
                error.message
            );

        }

    };


    const markOneAsRead = async (id) => {

        try {

            await api.put(
                `/notifications/${id}/read`
            );


            setNotifications(
                (previous) =>

                    previous.map(
                        (notification) =>

                            notification.id === id

                                ? {

                                    ...notification,

                                    read: true

                                }

                                : notification
                    )
            );


            setUnreadCount(
                (previous) =>

                    previous > 0

                        ? previous - 1

                        : 0
            );

        }
        catch (error) {

            console.error(
                "MARK ONE READ ERROR:",
                error.response?.data ||
                error.message
            );

        }

    };

    const getRiskClass = (riskLevel) => {

        const risk =
            String(
                riskLevel || "LOW"
            ).toLowerCase();


        if (risk.includes("high")) {

            return "high";

        }


        if (risk.includes("medium")) {

            return "medium";

        }


        return "low";

    };

    const getTimeAgo = (date) => {

        if (!date) {

            return "Just now";

        }


        const seconds =
            Math.floor(

                (
                    new Date() -
                    new Date(date)
                ) / 1000

            );


        if (seconds < 60) {

            return "Just now";

        }


        const minutes =
            Math.floor(
                seconds / 60
            );


        if (minutes < 60) {

            return `${minutes} min ago`;

        }


        const hours =
            Math.floor(
                minutes / 60
            );


        if (hours < 24) {

            return `${hours} hr ago`;

        }


        const days =
            Math.floor(
                hours / 24
            );


        return `${days} day${
            days > 1
                ? "s"
                : ""
        } ago`;

    };


    const handleBellClick = () => {

        setOpen(
            (previous) => !previous
        );


        fetchNotifications();

    };


    return (

        <div
            className="notification-center"
            ref={notificationRef}
        >

            <button
                className="notification-bell"
                onClick={handleBellClick}
                aria-label="Notifications"
            >

                <span className="bell-icon">

                    🔔

                </span>


                {unreadCount > 0 && (

                    <span className="notification-count">

                        {
                            unreadCount > 9
                                ? "9+"
                                : unreadCount
                        }

                    </span>

                )}

            </button>

            {open && (

                <div className="notification-dropdown">

                    <div className="notification-header">

                        <div>

                            <span>
                                SECURITY ALERTS
                            </span>


                            <h3>
                                Notifications
                            </h3>

                        </div>


                        {unreadCount > 0 && (

                            <button
                                className="mark-read-btn"
                                onClick={markAllAsRead}
                            >

                                Mark all read

                            </button>

                        )}

                    </div>


                    <div className="notification-list">


                        {loading ? (

                            <div className="notification-loading">

                                Loading notifications...

                            </div>

                        ) : notifications.length === 0 ? (

                            <div className="notification-empty">

                                <div>
                                    🛡️
                                </div>


                                <strong>
                                    No notifications
                                </strong>


                                <p>
                                    Your security alerts will
                                    appear here.
                                </p>

                            </div>

                        ) : (

                            notifications.map(
                                (notification) => (

                                    <div

                                        className={
                                            `notification-item ${
                                                getRiskClass(
                                                    notification.riskLevel
                                                )
                                            } ${
                                                !notification.read
                                                    ? "unread"
                                                    : ""
                                            }`
                                        }

                                        key={notification.id}

                                        onClick={() => {

                                            if (
                                                !notification.read
                                            ) {

                                                markOneAsRead(
                                                    notification.id
                                                );

                                            }

                                        }}

                                    >

                                        <div

                                            className={
                                                `notification-risk-icon ${
                                                    getRiskClass(
                                                        notification.riskLevel
                                                    )
                                                }`
                                            }

                                        >

                                            {
                                                notification.icon ||
                                                "🛡️"
                                            }

                                        </div>

                                        <div
                                            className="notification-content"
                                        >

                                            <p>

                                                {
                                                    notification.message ||
                                                    "Security activity detected"
                                                }

                                            </p>


                                            <div>

                                                <span

                                                    className={
                                                        `notification-risk ${
                                                            getRiskClass(
                                                                notification.riskLevel
                                                            )
                                                        }`
                                                    }

                                                >

                                                    {
                                                        notification.riskLevel ||
                                                        "LOW"
                                                    }

                                                </span>


                                                <small>

                                                    {
                                                        getTimeAgo(
                                                            notification.createdAt
                                                        )
                                                    }

                                                </small>

                                            </div>

                                        </div>


                                        {!notification.read && (

                                            <span
                                                className="unread-dot"
                                            ></span>

                                        )}

                                    </div>

                                )
                            )

                        )}

                    </div>


                    <div className="notification-footer">

                        🛡️ DhanRakshak AI Monitoring Active

                    </div>

                </div>

            )}

        </div>

    );

}


export default NotificationCenter;
