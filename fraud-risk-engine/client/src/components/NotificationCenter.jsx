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

    const notificationRef = useRef(null);


    // ==================================
    // GET NOTIFICATIONS
    // ==================================

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
                error
            );

        }
        finally {

            setLoading(false);

        }

    };


    // ==================================
    // LOAD ON PAGE OPEN
    // ==================================

    useEffect(() => {

        fetchNotifications();

    }, []);


    // ==================================
    // CLOSE WHEN CLICKING OUTSIDE
    // ==================================

    useEffect(() => {

        const handleClickOutside = (event) => {

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


    // ==================================
    // MARK ALL AS READ
    // ==================================

    const markAllAsRead = async () => {

        try {

            await api.put(
                "/notifications/read-all"
            );


            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    read: true
                }))
            );


            setUnreadCount(0);

        }
        catch (error) {

            console.error(
                "MARK READ ERROR:",
                error
            );

        }

    };


    // ==================================
    // RISK CLASS
    // ==================================

    const getRiskClass = (riskLevel) => {

        const risk =
            riskLevel?.toLowerCase() || "low";


        if (risk.includes("high")) {

            return "high";

        }


        if (risk.includes("medium")) {

            return "medium";

        }


        return "low";

    };


    // ==================================
    // TIME FORMAT
    // ==================================

    const getTimeAgo = (date) => {

        if (!date) {

            return "Just now";

        }


        const seconds =
            Math.floor(
                (new Date() - new Date(date)) / 1000
            );


        if (seconds < 60) {

            return "Just now";

        }


        const minutes =
            Math.floor(seconds / 60);


        if (minutes < 60) {

            return `${minutes} min ago`;

        }


        const hours =
            Math.floor(minutes / 60);


        if (hours < 24) {

            return `${hours} hr ago`;

        }


        const days =
            Math.floor(hours / 24);


        return `${days} day ago`;

    };


    return (

        <div
            className="notification-center"
            ref={notificationRef}
        >


            {/* ================= BELL ================= */}

            <button
                className="notification-bell"
                onClick={() => {

                    setOpen(!open);


                    if (!open) {

                        fetchNotifications();

                    }

                }}
            >

                <span className="bell-icon">
                    🔔
                </span>


                {unreadCount > 0 && (

                    <span className="notification-count">

                        {unreadCount > 9
                            ? "9+"
                            : unreadCount}

                    </span>

                )}

            </button>



            {/* ================= DROPDOWN ================= */}

            {open && (

                <div className="notification-dropdown">


                    {/* HEADER */}

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



                    {/* LIST */}

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

                                            {notification.icon}

                                        </div>


                                        <div className="notification-content">

                                            <p>
                                                {notification.message}
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

                                                    {notification.riskLevel}

                                                </span>


                                                <small>

                                                    {getTimeAgo(
                                                        notification.createdAt
                                                    )}

                                                </small>

                                            </div>

                                        </div>


                                        {!notification.read && (

                                            <span className="unread-dot"></span>

                                        )}

                                    </div>

                                )
                            )

                        )}

                    </div>



                    {/* FOOTER */}

                    <div className="notification-footer">

                        🛡️ FraudGuard AI Monitoring Active

                    </div>

                </div>

            )}

        </div>

    );

}


export default NotificationCenter;