CREATE TABLE `user`(
    `user_Id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `last_Name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `age` INT NOT NULL,
    `gender` VARCHAR(255) NOT NULL,
    `state` VARCHAR(255) NOT NULL,
    `street_Address` VARCHAR(255) NOT NULL,
    `postal_Code` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `country` VARCHAR(255) NOT NULL,
    `passwords` VARCHAR(255) NOT NULL
);
CREATE TABLE `trades`(
    `trade_Id` VARCHAR(255)  NOT NULL PRIMARY KEY,
    `user_Id` INT UNSIGNED NOT NULL,
    `date` DATE NOT NULL,
    `time` TIME NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `quantity` INT NOT NULL,
    `stock_Id` INT UNSIGNED NOT NULL
);
CREATE TABLE `market_prices`(
    `price_Id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `price_Date` INT NOT NULL,
    `close` INT NOT NULL,
    `high` DECIMAL(8, 2) NOT NULL,
    `low` DECIMAL(8, 2) NOT NULL,
    `open` DECIMAL(8, 2) NOT NULL,
    `volume` INT NOT NULL,
    `stock_Id` INT UNSIGNED NOT NULL
);
CREATE TABLE `stock`(
    `stock_Id` INT UNSIGNED NOT NULL,
    `ticker` VARCHAR(255) NOT NULL,
    `stock_Name` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`stock_Id`)
);
ALTER TABLE
    `trades` ADD CONSTRAINT `trades_user_id_foreign` FOREIGN KEY(`user_Id`) REFERENCES `user`(`user_Id`);
ALTER TABLE
    `trades` ADD CONSTRAINT `trades_stock_id_foreign` FOREIGN KEY(`stock_Id`) REFERENCES `stock`(`stock_Id`);
ALTER TABLE
    `market_prices` ADD CONSTRAINT `market_prices_stock_id_foreign` FOREIGN KEY(`stock_Id`) REFERENCES `stock`(`stock_Id`);
