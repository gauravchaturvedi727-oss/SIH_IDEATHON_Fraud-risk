import os
import joblib
import numpy as np
import pandas as pd

from xgboost import XGBClassifier

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report


FEATURES = [
    "amount",
    "newDevice",
    "newLocation",
    "rapidTransactions",
    "failedLogins",
    "otpRequests"
]


# ==========================================
# 1. CREATE DEMO DATASET
# ==========================================

np.random.seed(42)

ROWS = 5000

data = pd.DataFrame({

    "amount": np.random.randint(
        500,
        100000,
        ROWS
    ),

    "newDevice": np.random.randint(
        0,
        2,
        ROWS
    ),

    "newLocation": np.random.randint(
        0,
        2,
        ROWS
    ),

    "rapidTransactions": np.random.randint(
        0,
        7,
        ROWS
    ),

    "failedLogins": np.random.randint(
        0,
        6,
        ROWS
    ),

    "otpRequests": np.random.randint(
        0,
        6,
        ROWS
    )
})


# ==========================================
# 2. CREATE RISK SIGNAL
# ==========================================

risk = (

    (data["amount"] > 50000) * 2

    + data["newDevice"] * 2

    + data["newLocation"] * 1

    + (data["rapidTransactions"] >= 3) * 2

    + (data["failedLogins"] >= 3) * 2

    + (data["otpRequests"] >= 2) * 2

)


# ==========================================
# 3. TARGET
# ==========================================

data["fraud"] = (
    risk >= 5
).astype(int)


X = data[FEATURES]

y = data["fraud"]


# ==========================================
# 4. TRAIN TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y,

    test_size=0.2,

    random_state=42,

    stratify=y
)


# ==========================================
# 5. XGBOOST
# ==========================================

model = XGBClassifier(

    n_estimators=180,

    max_depth=4,

    learning_rate=0.06,

    subsample=0.85,

    colsample_bytree=0.85,

    eval_metric="logloss",

    random_state=42
)


model.fit(
    X_train,
    y_train
)


# ==========================================
# 6. EVALUATION
# ==========================================

predictions = model.predict(
    X_test
)


accuracy = accuracy_score(
    y_test,
    predictions
)


print(
    f"\nAccuracy: {accuracy:.4f}\n"
)


print(
    classification_report(
        y_test,
        predictions
    )
)


# ==========================================
# 7. SAVE MODEL
# ==========================================

os.makedirs(
    "models",
    exist_ok=True
)


joblib.dump(
    model,
    "models/risk_model.pkl"
)


print(
    "Model saved successfully!"
)