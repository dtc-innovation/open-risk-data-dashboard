# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-08-11 11:50
from __future__ import unicode_literals

from django.db import migrations
from django.core import serializers
from django.core.management import call_command

import csv
import json


def forwards_func(apps, schema_editor):
    # We get the model from the versioned app registry;
    # if we directly import it, it'll be the wrong version
    KeyDataset = apps.get_model("ordd_api", "KeyDataset")
    KeyCategory = apps.get_model("ordd_api", "KeyCategory")
    KeyDatasetName = apps.get_model("ordd_api", "KeyDatasetName")
    KeyTagGroup = apps.get_model("ordd_api", "KeyTagGroup")
    KeyTag = apps.get_model("ordd_api", "KeyTag")
    KeyLevel = apps.get_model("ordd_api", "KeyLevel")
    Dataset = apps.get_model("ordd_api", "Dataset")

    db_alias = schema_editor.connection.alias

    #  Rename entries
    #
    #    KeyCategory
    item = KeyCategory.objects.using(db_alias).get(name='Base Data')
    item.name = 'Base data'
    item.save()

    #    KeyTag
    item = KeyTag.objects.using(db_alias).get(name='Road infrastructure')
    item.name = 'Roads'
    item.save()

    item = KeyTag.objects.using(db_alias).get(name='Harbours')
    item.name = 'Harbors'
    item.save()

    #    KeyDatasetName
    item = KeyDatasetName.objects.using(db_alias).get(name='Hazard Scenarios')
    item.name = 'Historical records of hazard events'
    item.save()

    #    KeyDatasetName
    item = KeyDatasetName.objects.using(db_alias).get(
        name='List Type Of Volcanoes')
    item.name = 'Volcanoes'
    item.save()

    #    KeyDatasetName simple capitalization
    items = KeyDatasetName.objects.using(db_alias).all()
    for item in items:
        item.name = item.name.capitalize()
        item.save()

    kd = []
    kd_code = []
    kt = []

    with open('contents/key_datasets/resilience-index-'
              'datasets-list-v10 - Datasets.csv', 'r') as kdfile,\
        open('contents/key_datasets/resilience-index-'
             'datasets-list-v10 - Tags.csv', 'r') as ktfile:
        kdcsv = csv.reader(kdfile, delimiter=',')
        ktcsv = csv.reader(ktfile, delimiter=',')

        for row in kdcsv:
            if len(row) == 0:
                continue
            kd.append(row)
            kd_code.append(row[0])
        kd = kd[1:]
        kd_code = kd_code[1:]

        for row in ktcsv:
            if len(row) == 0:
                continue
            kt.append(row)
        kt = kt[1:]

        #
        #
        #     CHECKING AND INSERTING
        #
        #

        #
        #  INSERT MISSING DATASETNAME
        #
        print("  INSERT MISSING DATASETNAME")
        for keydataset in kd:
            datasetname = keydataset[2]
            print(datasetname)
            try:
                item = KeyDatasetName.objects.using(db_alias).get(
                    name=datasetname)
            except KeyDatasetName.DoesNotExist:
                print("DatasetName [%s] is missing, create it" % datasetname)
                KeyDatasetName.objects.using(
                    db_alias).create(name=datasetname)

        #
        #  CHECK MISSING CATEGORY
        #
        print("  CHECK MISSING CATEGORY")
        for keydataset in kd:
            category = keydataset[1]
            print("  check [%s]" % category)
            item = KeyCategory.objects.using(db_alias).get(
                name=category)

        #
        #  CHECK MISSING TAGGROUPS
        #
        print("  CHECK MISSING TAGGROUPS")
        for keydataset in kd:
            taggroup = keydataset[3]
            print("  check [%s]" % taggroup)
            if taggroup == "":
                continue
            # try:
            item = KeyTagGroup.objects.using(db_alias).get(
                name=taggroup)

        #
        #  CHECK MISSING KEYDATASET AND UPDATE THE OLD
        #
        print("  CHECK MISSING KEYDATASET AND UPDATE THE OLD")
        for keydataset in kd:
            #  ID,Category,Dataset,Tags,Description,Level
            code_in = keydataset[0]
            category_in = keydataset[1]
            datasetname_in = keydataset[2]
            taggroup_in = keydataset[3]
            description_in = keydataset[4]
            level_in = keydataset[5]

            keydataset_cur = KeyDataset.objects.using(db_alias).get(
                code=code_in)
            category_cur = KeyCategory.objects.using(db_alias).get(
                name=category_in)
            datasetname_cur = KeyDatasetName.objects.using(db_alias).get(
                name=datasetname_in)
            if taggroup_in != '':
                taggroup_cur = KeyTagGroup.objects.using(db_alias).get(
                    name=taggroup_in)
            else:
                taggroup_cur = None
            level_cur = KeyLevel.objects.using(db_alias).get(
                    name=level_in)
            keydataset_cur.category = category_cur
            keydataset_cur.datasetname = datasetname_cur
            keydataset_cur.taggroup = taggroup_cur
            keydataset_cur.description = description_in
            keydataset_cur.level = level_cur
            keydataset_cur.save()

        #
        #  INSERT MISSING TAGS
        #
        print("  TAGS: check tags not yet inserted")
        objs = KeyTag.objects.using(db_alias).all()
        for tag in kt:
            for obj in objs:
                tag_cur = [obj.group.name, obj.name]
                if tag_cur[0] == tag[0] and tag_cur[1] == tag[1]:
                    break
            else:
                print("  TAG [%s,%s] not found, create it" % (tag[0], tag[1]))
                group = KeyTagGroup.objects.using(db_alias).get(name=tag[0])
                KeyTag.objects.using(db_alias).create(group=group, name=tag[1])
        print("  Done")

        #
        #
        #    DELETE OBSOLETE OBJECTS
        #
        #

        #
        #  DELETE KEYDATASETS (AND RELATED DATASETS)
        print("DELETE KEYDATASETS (AND RELATED DATASETS)")
        KeyDataset.objects.using(db_alias).exclude(code__in=kd_code).delete()

        print("DELETE KEYTAGS")
        for obj in KeyTag.objects.using(db_alias).all():
            for tag in kt:
                tag_cur = [obj.group.name, obj.name]
                if tag_cur[0] == tag[0] and tag_cur[1] == tag[1]:
                    break
            else:
                print("  Tag [%s,%s] not found, try to delete it" %
                      (tag_cur[0], tag_cur[1]))

                country_len = len(obj.country_set.all())
                dataset_len = len(obj.dataset_set.all())
                keydataset_len = len(obj.keydataset_set.all())
                if (country_len > 0 or
                        dataset_len > 0 or
                        keydataset_len > 0):
                    raise ValueError(
                        "There are M2M references to it (%d, %d, %d)"
                        % (country_len, dataset_len, keydataset_len))
                obj.delete()

        print("DELETE KEYDATASETNAMES")
        KeyDatasetName.objects.exclude(keydatasets__in=kd_code).delete()


def backwards_func(apps, schema_editor):
    KeyCategory = apps.get_model("ordd_api", "KeyCategory")
    KeyDatasetName = apps.get_model("ordd_api", "KeyDatasetName")
    KeyTag = apps.get_model("ordd_api", "KeyTag")

    db_alias = schema_editor.connection.alias

    #    KeyDatasetName
    item = KeyDatasetName.objects.using(db_alias).get(
        name='Volcanoes')
    item.name = 'List Type Of Volcanoes'
    item.save()

    #    KeyDatasetName
    item = KeyDatasetName.objects.using(db_alias).get(
        name='Historical records of hazard events')
    item.name = 'Hazard Scenarios'
    item.save()

    #    KeyDatasetName simple return to titlezation
    items = KeyDatasetName.objects.using(db_alias).all()
    for item in items:
        item.name = item.name.title()
        item.save()

    #    KeyTag
    item = KeyTag.objects.using(db_alias).get(name='Harbors')
    item.name = 'Harbours'
    item.save()

    item = KeyTag.objects.using(db_alias).get(name='Roads')
    item.name = 'Road infrastructure'
    item.save()

    #    KeyCategory
    item = KeyCategory.objects.using(db_alias).get(name='Base data')
    item.name = 'Base Data'
    item.save()


class Migration(migrations.Migration):

    dependencies = [
        ('ordd_api', '0016_rename_dataset_fields'),
    ]

    operations = [
        migrations.RunPython(forwards_func, backwards_func),
    ]

